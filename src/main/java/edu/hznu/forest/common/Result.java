package edu.hznu.forest.common;

import lombok.Data;

@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.message = "success";
        r.data = data;
        return r;
    }

    public static <T> Result<T> error(Integer code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        return r;
    }

    public static <T> Result<T> ok() {
        return success(null);
    }

    public static <T> Result<T> fail(String message) {
        return error(400, message);
    }

    public static <T> Result<T> unauthorized() {
        return error(401, "未授权，请先登录");
    }
}
